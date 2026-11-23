import 'package:dio/dio.dart';
import 'package:eduquiz/core/network/dio_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:eduquiz/features/auth/providers/auth_controller.dart';
import 'package:eduquiz/features/home/widgets/home_sections.dart';

String timeAgo(DateTime t) {
  final d = DateTime.now().difference(t);
  if (d.inMinutes < 1) return 'vừa xong';
  if (d.inMinutes < 60) return '${d.inMinutes} phút trước';
  if (d.inHours < 24) return '${d.inHours} giờ trước';
  return '${d.inDays} ngày trước';
}

class HomeRepository {
    HomeRepository(this._dio) ;
    final Dio _dio;

Future<List<ContinueItem>> continueLearning() async {
    final res = await _dio.get('/attempts/in-progress');
    final list = res.data as List<dynamic>;
    return list.map((e) {
      final j = e as Map<String, dynamic>;
      return ContinueItem(
        j['title'] as String,
        j['answered'] as int,
        j['total'] as int,
        timeAgo(DateTime.parse(j['startedAt'] as String)),
      );
    }).toList();
  }
}
final homeRepositoryProvider =
    Provider((ref) => HomeRepository(ref.watch(dioProvider)));
 
/// Danh sách "Tiếp tục học" của người đang đăng nhập.
/// Đổi tài khoản thì tự tải lại. Gọi ref.invalidate(continueItemsProvider) để làm mới thủ công.
final continueItemsProvider =
    FutureProvider.autoDispose<List<ContinueItem>>((ref) async {
  final user = ref.watch(authControllerProvider).value;
  if (user == null) return const [];
  return ref.watch(homeRepositoryProvider).continueLearning();
});
