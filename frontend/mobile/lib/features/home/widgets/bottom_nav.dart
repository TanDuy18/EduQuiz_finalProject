import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'home_theme.dart';

/// Thanh điều hướng dưới: Trang chủ, Học tập, Đề thi, Lịch sử, Cá nhân (avatar).
class AppBottomNav extends StatelessWidget {
  const AppBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
    this.avatarUrl,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;
  final String? avatarUrl;

  static const _icons = [
    Icons.home_rounded,
    Icons.school_rounded,
    Icons.description_rounded,
    Icons.schedule_rounded,
  ];
  static const _labels = [
    'Trang chủ',
    'Trường học',
    'Đề thi',
    'Lịch sử',
    'Cá nhân',
  ];
  static const _idle = Color(0xFFC4C8D0);
  static const routes = ['/home', '/learn', '/exam', '/history', '/profile'];

  static void goTo(BuildContext context, int index) =>
      GoRouter.of(context).go(routes[index]);

  Widget _icon(int i, bool active) {
    if (i < 4) return Icon(_icons[i], size: 28, color: active ? kLink : _idle);
    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(
          color: active ? kLink : const Color(0xFFA8D86A),
          width: 2,
        ),
      ),
      child: CircleAvatar(
        radius: 12,
        backgroundColor: const Color(0xFFE8ECF4),
        backgroundImage: avatarUrl == null ? null : NetworkImage(avatarUrl!),
        child: avatarUrl == null
            ? const Icon(Icons.person_rounded, size: 16, color: kInk)
            : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.06),
          blurRadius: 16,
          offset: const Offset(0, -4),
        ),
      ],
    ),
    child: SafeArea(
      top: false,
      child: SizedBox(
        height: 66,
        child: Row(
          children: [
            for (var i = 0; i < 5; i++)
              Expanded(
                child: Semantics(
                  button: true,
                  selected: i == currentIndex,
                  label: _labels[i],
                  child: InkWell(
                    onTap: () => onTap(i),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _icon(i, i == currentIndex),
                        const SizedBox(height: 4),
                        Container(
                          width: 18,
                          height: 3,
                          decoration: BoxDecoration(
                            color: i == currentIndex
                                ? kLink
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    ),
  );
}
