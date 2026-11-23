import 'package:dio/dio.dart';
import 'package:eduquiz/features/auth/data/token_storage.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Tăng lên mỗi khi phiên đăng nhập chết hẳn (refresh token hết hạn/bị thu hồi).
/// Widget gốc của app lắng nghe provider này để đưa người dùng về /login.
class SessionExpiredNotifier extends Notifier<int> {
  @override
  int build() => 0;
  void notify() => state++;
}

final sessionExpiredProvider = NotifierProvider<SessionExpiredNotifier, int>(
  SessionExpiredNotifier.new,
);

enum _RefreshResult { ok, invalid, networkError }

BaseOptions _options() => BaseOptions(
  baseUrl: kIsWeb
      ? 'http://localhost:8001/api/v1'
      : 'http://10.0.2.2:8001/api/v1',
  connectTimeout: const Duration(seconds: 10),
  receiveTimeout: const Duration(seconds: 15),
  headers: {'Content-Type': 'application/json'},
);

bool _isAuthPath(String path) =>
    path.startsWith('/auth/google') ||
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/register') ||
    path.startsWith('/auth/refresh') ||
    path.startsWith('/auth/logout');

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(_options());
  // Dio riêng (không có interceptor) để gọi refresh, tránh lặp vô hạn
  final refreshDio = Dio(_options());
  final tokens = TokenStorage();

  Future<_RefreshResult>?
  refreshing; // nhiều request 401 cùng lúc chỉ refresh 1 lần

  Future<_RefreshResult> doRefresh() async {
    final refreshToken = await tokens.readRefresh();
    if (refreshToken == null) return _RefreshResult.invalid;
    try {
      final res = await refreshDio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final data = res.data as Map<String, dynamic>;
      await tokens.save(
        data['accessToken'] as String,
        data['refreshToken'] as String?,
      );
      return _RefreshResult.ok;
    } on DioException catch (e) {
      final code = e.response?.statusCode;
      if (code != null && code >= 400 && code < 500) {
        await tokens.clear(); // refresh token chết hẳn
        return _RefreshResult.invalid;
      }
      return _RefreshResult.networkError; // mất mạng/server lỗi: giữ token
    } catch (_) {
      return _RefreshResult.networkError;
    }
  }

  dio.interceptors.add(
    InterceptorsWrapper(
      // 1) Gắn access token vào mọi request (trừ các endpoint đăng nhập)
      onRequest: (options, handler) async {
        if (!_isAuthPath(options.path)) {
          final token = await tokens.readAccess();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
        }
        handler.next(options);
      },

      // 2) Gặp 401 -> tự refresh token rồi thử lại request đúng 1 lần
      onError: (e, handler) async {
        final req = e.requestOptions;
        final is401 = e.response?.statusCode == 401;
        if (!is401 || _isAuthPath(req.path) || req.extra['retried'] == true) {
          return handler.next(e);
        }

        refreshing ??= doRefresh().whenComplete(() => refreshing = null);
        final result = await refreshing!;

        if (result == _RefreshResult.invalid) {
          ref.read(sessionExpiredProvider.notifier).notify();
          return handler.next(e);
        }
        if (result == _RefreshResult.networkError) {
          return handler.next(
            DioException(
              requestOptions: req,
              type: DioExceptionType.connectionError,
            ),
          );
        }

        final token = await tokens.readAccess();
        req.headers['Authorization'] = 'Bearer $token';
        req.extra['retried'] = true;
        try {
          handler.resolve(await dio.fetch(req));
        } on DioException catch (e2) {
          handler.next(e2);
        }
      },
    ),
  );

  if (kDebugMode) {
    // Tắt log body/header để không lộ token ra console.
    dio.interceptors.add(
      LogInterceptor(
        requestHeader: false,
        requestBody: false,
        responseHeader: false,
        responseBody: false,
      ),
    );
  }
  return dio;
});
