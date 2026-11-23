import 'dart:async';

import 'package:eduquiz/core/theme/app_theme.dart';
import 'package:flutter/material.dart';

class HeroSlide {
  const HeroSlide({
    required this.tag,
    required this.title,
    required this.cta,
    required this.colors,
    required this.tagBg,
    required this.tagFg,
    this.subtitle = 'Luyện tập, thi thử và theo dõi kết quả dễ dàng',
    this.onTap,
  });

  final String tag;
  final String title;
  final String subtitle;
  final String cta;
  final List<Color> colors;
  final Color tagBg; // nền nhãn nhỏ phía trên
  final Color tagFg; // chữ nhãn
  final VoidCallback? onTap;
}

// Màu gradient lấy đúng từ Figma (0% -> 100%, chéo từ góc trên trái xuống góc dưới phải).
const kHeroSlides = [
  HeroSlide(
    tag: 'Học thông minh hơn',
    title: 'Chinh phục kiến thức cùng EduQuiz !',
    cta: 'Bắt đầu học',
    colors: [Color(0xFF2F6BFF), Color(0xFF7FB2FF)],
    tagBg: Color(0xFFC5D9FF),
    tagFg: Color(0xFF2F6BFF),
  ),
  HeroSlide(
    tag: 'Theo dõi tiến bộ',
    title: 'Mỗi ngày tiến bộ một chút',
    cta: 'Xem thống kê',
    colors: [Color(0xFFFF8A1F), Color(0xFFFFD04D)],
    tagBg: Color(0xFFFFD27A),
    tagFg: Color(0xFFFF8A1F),
  ),
  HeroSlide(
    tag: 'Thử thách mới',
    title: 'Đề thi đa dạng, cập nhật liên tục',
    cta: 'Làm đề ngay',
    colors: [Color(0xFF7B3FF2), Color(0xFFFF7EB6)],
    tagBg: Color(0xFFFF9FCB),
    tagFg: Color(0xFF7B3FF2),
  ),
];

/// Banner tự chuyển slide mỗi vài giây (vuốt tay cũng được), lặp vô hạn.
class HeroCarousel extends StatefulWidget {
  const HeroCarousel({
    super.key,
    this.slides = kHeroSlides,
    this.interval = const Duration(seconds: 3),
  });

  final List<HeroSlide> slides;
  final Duration interval;

  @override
  State<HeroCarousel> createState() => _HeroCarouselState();
}

class _HeroCarouselState extends State<HeroCarousel> {
  late final PageController _controller = PageController(
    initialPage: widget.slides.length * 1000,
  );
  Timer? _timer;
  int _index = 0;

  @override
  void initState() {
    super.initState();
    _startTimer();
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(widget.interval, (_) {
      if (!mounted || !_controller.hasClients) return;
      if (MediaQuery.disableAnimationsOf(context)) return;
      _controller.nextPage(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final n = widget.slides.length;
    return SizedBox(
      height: 214,
      child: Stack(
        children: [
          PageView.builder(
            controller: _controller,
            onPageChanged: (i) {
              setState(() => _index = i % n);
              _startTimer(); // vuốt tay thì tính lại giờ
            },
            itemBuilder: (_, i) => _SlideCard(widget.slides[i % n]),
          ),
          Positioned(
            right: 28,
            bottom: 28,
            child: Row(
              children: [
                for (var i = 0; i < n; i++)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    margin: const EdgeInsets.symmetric(horizontal: 2.5),
                    width: i == _index ? 22 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: i == _index
                          ? Colors.white
                          : Colors.black.withValues(alpha: 0.25),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SlideCard extends StatelessWidget {
  const _SlideCard(this.slide);

  final HeroSlide slide;

  Widget _circle({
    double? right,
    double? top,
    double? bottom,
    required double size,
    required double alpha,
  }) => Positioned(
    right: right,
    top: top,
    bottom: bottom,
    width: size,
    height: size,
    child: DecoratedBox(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withValues(alpha: alpha),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    final fg = slide.colors.first;
    return Padding(
      padding: const EdgeInsets.fromLTRB(0, 0, 8, 14),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: slide.colors,
          ),
          boxShadow: [
            BoxShadow(
              color: slide.colors.last.withValues(alpha: 0.28),
              offset: const Offset(8, 10),
              blurRadius: 4,
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Stack(
            fit: StackFit.expand,
            children: [
              _circle(right: -36, top: -38, size: 160, alpha: 0.12),
              _circle(right: 64, top: 90, size: 52, alpha: 0.15),
              _circle(right: -46, bottom: -14, size: 120, alpha: 0.10),
              Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: slide.tagBg,
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: Text(
                        slide.tag,
                        style: AppTheme.heading2(size: 10, color: Color(0xFF0050FF)),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 210),
                      child: Text(
                        slide.title,
                        style: AppTheme.heading(
                          size: 16,
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 190),
                      child: Text(
                        slide.subtitle,
                        style: AppTheme.heading2(
                          size: 10,
                          color: Colors.white,
                          fontWeight: FontWeight.w300,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Material(
                      color: Colors.white,
                      shape: const StadiumBorder(),
                      child: InkWell(
                        customBorder: const StadiumBorder(),
                        onTap: slide.onTap,
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(14, 8, 10, 8),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                slide.cta,
                                style: AppTheme.heading(
                                  size: 12,
                                  color: fg,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(width: 2),
                              Icon(
                                Icons.chevron_right_rounded,
                                size: 16,
                                color: fg,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
