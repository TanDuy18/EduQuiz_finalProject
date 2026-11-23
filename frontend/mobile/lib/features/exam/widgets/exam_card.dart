import 'package:eduquiz/core/theme/app_theme.dart';
import 'package:flutter/material.dart';

/// Màu và biểu tượng của từng môn (lấy theo Figma).
class SubjectStyle {
  const SubjectStyle({
    required this.chip,
    required this.chipText,
    required this.tile,
    required this.icon,
    required this.iconColor,
    this.asset,
  });

  final Color chip; // nền nhãn môn và chip lọc
  final Color chipText; // chữ trên nhãn
  final Color tile; // nền ô biểu tượng bên trái thẻ
  final IconData icon; // biểu tượng dự phòng khi chưa có ảnh
  final Color iconColor;
  final String? asset; // ảnh xuất từ Figma (60x60), chưa có thì dùng icon
}

const kSubjectStyles = {
  'Toán': SubjectStyle(
    chip: Color(0xFF73E1FF), chipText: Color(0xFF024759),
    tile: Color(0xFF73E1FF), icon: Icons.calculate_rounded,
    iconColor: Color(0xFF2C7BE5), asset: 'assets/images/exams/math.png',
  ),
  'Ngữ văn': SubjectStyle(
    chip: Color(0xFFFFDA72), chipText: Color(0xFF816300),
    tile: Color(0xFFFFF1B8), icon: Icons.history_edu_rounded,
    iconColor: Color(0xFFB7791F),
  ),
  'Hoá học': SubjectStyle(
    chip: Color(0xFFFFA9A9), chipText: Color(0xFFAA0000),
    tile: Color(0xFFFFD0D6), icon: Icons.science_rounded,
    iconColor: Color(0xFFD9477A),
  ),
  'Vật lý': SubjectStyle(
    chip: Color(0xFFA8FB97), chipText: Color(0xFF126900),
    tile: Color(0xFFCFF5C8), icon: Icons.bolt_rounded,
    iconColor: Color(0xFF126900), asset: 'assets/images/exams/atom.png',
  ),
  'Ngoại ngữ': SubjectStyle(
    chip: Color(0xFFDFA7FF), chipText: Color(0xFF661596),
    tile: Color(0xFFEBD4FF), icon: Icons.public_rounded,
    iconColor: Color(0xFF661596),
  ),
  'Lịch sử': SubjectStyle(
    chip: Color(0xFFFF71E0), chipText: Color(0xFF77035E),
    tile: Color(0xFFFFC9F1), icon: Icons.account_balance_rounded,
    iconColor: Color(0xFF77035E),
  ),
};

class ExamItem {
  const ExamItem({
    required this.title,
    required this.subject,
    required this.questions,
    required this.minutes,
    required this.rating,
    required this.ratingCount,
    required this.plays,
    this.popular = false,
  });

  final String title;
  final String subject;
  final int questions;
  final int minutes;
  final String rating; // ví dụ '4,8'
  final String ratingCount; // ví dụ '1.2k'
  final String plays; // ví dụ '12,4k'
  final bool popular;
}

class ExamCard extends StatelessWidget {
  const ExamCard({super.key, required this.exam, this.onTap});

  final ExamItem exam;
  final VoidCallback? onTap;

  static const _grey = Color(0xFF676767);

  Widget _pill(String text, Color bg, Color fg) => Container(
        height: 17.6,
        padding: const EdgeInsets.symmetric(horizontal: 7),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(28),
        ),
        child: Text(text, style: AppTheme.body(size: 11, color: fg, height: 1.1)),
      );

  Widget _tileIcon(SubjectStyle s) {
    final fallback = Icon(s.icon, size: 44, color: s.iconColor);
    if (s.asset == null) return fallback;
    return Image.asset(
      s.asset!,
      width: 60,
      height: 60,
      errorBuilder: (_, __, ___) => fallback, // chưa có file ảnh thì hiện icon
    );
  }

  @override
  Widget build(BuildContext context) {
    final style = kSubjectStyles[exam.subject] ?? kSubjectStyles['Toán']!;

    return SizedBox(
      height: 118,
      child: Material(
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0xFFEAEAEA)),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(10, 0, 12, 0),
            child: Row(
              children: [
                Container(
                  width: 86,
                  height: 89,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: style.tile,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: _tileIcon(style),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Align(
                    alignment: Alignment.topLeft,
                    child: Padding(
                      padding: const EdgeInsets.only(top: 17),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            spacing: 7,
                            children: [
                              _pill(exam.subject, style.chip, style.chipText),
                              if (exam.popular)
                                _pill('Phổ biến', const Color(0xFFFFC973),
                                    const Color(0xFF865301)),
                            ],
                          ),
                          const SizedBox(height: 9),
                          Text(
                            exam.title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: AppTheme.heading(
                              size: 17,
                              color: Colors.black,
                              fontWeight: FontWeight.w600,
                            ).copyWith(height: 1.3),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            '${exam.questions} câu - ${exam.minutes} phút',
                            style: AppTheme.heading(
                              size: 12,
                              color: _grey,
                              fontWeight: FontWeight.w500,
                            ).copyWith(height: 1.2),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star_rounded,
                                  size: 14, color: Color(0xFFFFC107)),
                              const SizedBox(width: 3),
                              Text.rich(
                                TextSpan(
                                  style: AppTheme.heading(
                                    size: 11,
                                    color: _grey,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  children: [
                                    TextSpan(
                                      text: exam.rating,
                                      style: const TextStyle(color: Colors.black),
                                    ),
                                    TextSpan(
                                      text:
                                          ' (${exam.ratingCount})   -   ${exam.plays} lượt làm',
                                    ),
                                  ],
                                ),
                              ),
                            ],
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
      ),
    );
  }
}
