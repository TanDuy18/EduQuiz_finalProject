import 'package:dio/dio.dart';
import 'auth_models.dart';
import 'token_storage.dart';

class AuthRepository {
  AuthRepository(this._dio, this._tokens);

  final Dio _dio;
  final TokenStorage _tokens;

  Future<AuthResponse> loginWithGoogle(String idToken) async {
    try {
      final res = await _dio.post('/auth/google', data: {'idToken': idToken});
      final auth = AuthResponse.fromJson(res.data as Map<String, dynamic>);
      await _tokens.save(auth.accessToken, auth.refreshToken);
      return auth;
    } on DioException catch (e) {
      throw AuthException(
        _messageFrom(e, authFailed: 'Tài khoản Google không hợp lệ.'),
      );
    } on TypeError {
      throw const AuthException('Dữ liệu từ máy chủ không đúng định dạng.');
    }
  }

  Future<AuthResponse> loginWithPassword({
       required String identifier, 
       required String password,
  }) async {
    try {
      final res = await _dio.post('/auth/login', data: {'username': identifier, 'password': password});
      final auth = AuthResponse.fromJson(res.data as Map<String, dynamic>);
      await _tokens.save(auth.accessToken, auth.refreshToken);
      return auth;
    } on DioException catch (e) {
      throw AuthException(
        _messageFrom(e, authFailed: 'Gmail hoặc mật khẩu không đúng'),
      );
    } on TypeError {
      throw const AuthException('Dữ liệu từ máy chủ không đúng định dạng.');
    }
  }

  /// Khôi phục phiên đăng nhập từ token đã lưu.
  /// (Access token hết hạn sẽ được interceptor tự refresh.)
  /// Trả về null nếu chưa có token hoặc phiên đã chết.
  Future<AuthUser?> fetchMe() async {
    final token = await _tokens.readAccess();
    if (token == null) return null;
    try {
      final res = await _dio.get('/auth/me');
      return AuthUser.fromJson(res.data as Map<String, dynamic>);
    } on DioException catch (e) {
      final code = e.response?.statusCode;
      if (code == 401 || code == 403) {
        await _tokens.clear();
        return null;
      }
      throw AuthException(_messageFrom(e));
    } on TypeError {
      throw const AuthException('Dữ liệu từ máy chủ không đúng định dạng.');
    }
  }

  /// Đăng xuất: báo backend thu hồi refresh token (không bắt buộc thành công),
  /// rồi xóa token trên máy.
  Future<void> logout() async {
    final refresh = await _tokens.readRefresh();
    if (refresh != null) {
      try {
        await _dio.post('/auth/logout', data: {'refreshToken': refresh});
      } catch (_) {
        // mất mạng cũng không sao, vẫn xóa token cục bộ
      }
    }
    await _tokens.clear();
  }

  String _messageFrom(
    DioException e, {
    String authFailed = 'Phiên đăng nhập không hợp lệ.',
  }) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.connectionError:
        return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.';
      case DioExceptionType.badResponse:
        final data = e.response?.data;
        if (data is Map && data['message'] is String) {
          return data['message'] as String; // câu báo lỗi do backend gửi
        }
        final code = e.response?.statusCode;
        if (code == 401 || code == 403) return authFailed;
        return 'Máy chủ gặp lỗi ($code). Thử lại sau nhé.';
      default:
        return 'Có lỗi xảy ra. Thử lại nhé.';
    }
  }
}
