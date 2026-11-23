import 'package:eduquiz/core/theme/app_theme.dart';
import 'package:eduquiz/features/auth/providers/auth_controller.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../widgets/bottom_nav.dart';
import '../widgets/hero_carousel.dart';
import '../widgets/home_sections.dart';
import '../widgets/home_theme.dart';
import '../data/home_repository.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final avatar = ref.watch(authControllerProvider).value?.avatarUrl;
    final continueItems =
        ref.watch(continueItemsProvider).value ?? const <ContinueItem>[];
    return Scaffold(
      backgroundColor: kPageBg,
      bottomNavigationBar: AppBottomNav(
        currentIndex: 0,
        avatarUrl: avatar,
        onTap: (i) {
          if (i != 0) AppBottomNav.goTo(context, i);
        }, // TODO: chuyển tab (go_router / shell)
      ),
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            const _Header(),
            const SizedBox(height: 36),
            const HeroCarousel(),
            const SizedBox(height: 8),
            ModeCards(onPractice: () {}, onExam: () {}),
            const SizedBox(height: 28),
            SectionTitle(
              icon: Icons.format_list_bulleted_rounded,
              iconColor: const Color(0xFFE8604C),
              title: 'Danh mục',
              action: 'Xem tất cả',
              onAction: () {},
            ),
            const SizedBox(height: 12),
            const CategoryRow(),
            const SizedBox(height: 28),
            if (continueItems.isNotEmpty) ...[
              const SizedBox(height: 28),
              const SectionTitle(
                icon: Icons.sync_rounded,
                iconColor: kInk,
                title: 'Tiếp tục học',
              ),
              const SizedBox(height: 12),
              ContinueList(items: continueItems),
            ],
            SectionTitle(
              icon: Icons.star_rounded,
              iconColor: const Color(0xFFFFC107),
              title: 'Đề thi nổi bật',
              action: 'Xem thêm',
              onAction: () {},
            ),
            const SizedBox(height: 12),
            const FeaturedQuizCard(
              title: 'Đề thi thử THPT Quốc gia 2025',
              meta: 'Toán 12 - 50 câu - 90 phút',
            ),
          ],
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header();

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Text.rich(
        TextSpan(
          children: [
            TextSpan(
              text: 'Edu',
              style: AppTheme.heading(
                size: 28,
                color: const Color(0xFF413F3F),
                fontWeight: FontWeight.w700,
              ),
            ),
            TextSpan(
              text: 'Quiz',
              style: AppTheme.heading(
                size: 28,
                color: const Color(0xFFA3AEF7),
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
      const Spacer(),
      IconButton(
        onPressed: () {},
        tooltip: 'Thông báo',
        icon: Stack(
          clipBehavior: Clip.none,
          children: [
            const Icon(
              Icons.notifications_rounded,
              size: 30,
              color: Color(0xFFFFC107),
            ),
            Positioned(
              right: 1,
              top: 0,
              child: Container(
                width: 9,
                height: 9,
                decoration: const BoxDecoration(
                  color: Color(0xFFFF7A1A),
                  shape: BoxShape.circle,
                ),
              ),
            ),
          ],
        ),
      ),
    ],
  );
}
