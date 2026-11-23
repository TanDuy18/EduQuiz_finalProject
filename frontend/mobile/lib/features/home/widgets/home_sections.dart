import 'package:eduquiz/core/theme/app_theme.dart';
import 'package:flutter/material.dart';

import 'home_theme.dart';

/// Hai nút lớn: Luyện tập / Thi thử.
class ModeCards extends StatelessWidget {
  const ModeCards({super.key, this.onPractice, this.onExam});

  final VoidCallback? onPractice;
  final VoidCallback? onExam;

  Widget _card(String title, String sub, Color color, VoidCallback? onTap) =>
      Expanded(
        child: Material(
          color: color,
          borderRadius: BorderRadius.circular(12),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTheme.heading(
                      size: 17,
                      color: kInk,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(sub, style: AppTheme.body(size: 13, color: kInk)),
                ],
              ),
            ),
          ),
        ),
      );

  @override
  Widget build(BuildContext context) => Row(
        children: [
          _card('Luyện tập', 'Ôn tập kiến thức', kCyan, onPractice),
          const SizedBox(width: 14),
          _card('Thi thử', 'Kiểm tra năng lực', kViolet, onExam),
        ],
      );
}

/// Tiêu đề mục: biểu tượng + tên + liên kết bên phải.
class SectionTitle extends StatelessWidget {
  const SectionTitle({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.title,
    this.action,
    this.onAction,
  });

  final IconData icon;
  final Color iconColor;
  final String title;
  final String? action;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          Icon(icon, size: 22, color: iconColor),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              title,
              style: AppTheme.heading(
                size: 16,
                color: kInk,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (action != null)
            TextButton(
              onPressed: onAction,
              style: TextButton.styleFrom(
                foregroundColor: kLink,
                padding: const EdgeInsets.symmetric(horizontal: 4),
                minimumSize: const Size(0, 32),
                textStyle: AppTheme.body(size: 12, color: kLink),
              ),
              child: Text(action!),
            ),
        ],
      );
}

class Category {
  const Category(this.label, this.icon, this.color, this.iconColor);
  final String label;
  final IconData icon;
  final Color color;
  final Color iconColor;
}

// Biểu tượng tạm bằng icon có sẵn. Có ảnh từ Figma thì thay trong CategoryRow.
const kCategories = [
  Category('Toán', Icons.calculate_rounded, Color(0xFF7FF1FB), Color(0xFF2C7BE5)),
  Category('Ngữ văn', Icons.history_edu_rounded, Color(0xFFFDFB8C), Color(0xFFB7791F)),
  Category('Hoá học', Icons.science_rounded, Color(0xFFF4A9B7), Color(0xFFD9477A)),
  Category('Vật lý', Icons.bolt_rounded, Color(0xFFA2F99A), Color(0xFF1B2437)),
  Category('Tiếng Anh', Icons.public_rounded, Color(0xFF8DD9F4), Color(0xFF2C7BE5)),
];

class CategoryRow extends StatelessWidget {
  const CategoryRow({
    super.key,
    this.items = kCategories,
    this.onSelected,
  });

  final List<Category> items;
  final ValueChanged<Category>? onSelected;

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 72,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          clipBehavior: Clip.none,
          itemCount: items.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (_, i) {
            final c = items[i];
            return Material(
              color: c.color,
              borderRadius: BorderRadius.circular(8),
              child: InkWell(
                borderRadius: BorderRadius.circular(8),
                onTap: () => onSelected?.call(c),
                child: SizedBox(
                  width: 66,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(c.icon, size: 28, color: c.iconColor),
                      const SizedBox(height: 6),
                      Text(
                        c.label,
                        style: AppTheme.heading(
                          size: 12,
                          color: kInk,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      );
}

class ContinueItem {
  const ContinueItem(this.title, this.answered, this.total, this.lastOpened);
  final String title;
  final int answered;
  final int total;
  final String lastOpened;
}

/// Danh sách thẻ "Tiếp tục học", vuốt ngang, thẻ kế tiếp ló ra bên phải.
class ContinueList extends StatelessWidget {
  const ContinueList({super.key, required this.items, this.onTap});

  final List<ContinueItem> items;
  final ValueChanged<ContinueItem>? onTap;

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width * 0.82;
    return SizedBox(
      height: 70,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        clipBehavior: Clip.none,
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (_, i) {
          final it = items[i];
          final progress = it.total == 0 ? 0.0 : it.answered / it.total;
          return SizedBox(
            width: width,
            child: Material(
              color: Colors.white,
              elevation: 1.5,
              shadowColor: Colors.black26,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: const BorderSide(color: Color(0xFF9AA0AE)),
              ),
              child: InkWell(
                borderRadius: BorderRadius.circular(8),
                onTap: () => onTap?.call(it),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: kIndigo.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.description_rounded,
                            size: 20, color: kIndigo),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              it.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: AppTheme.heading(
                                size: 15,
                                color: kInk,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            Text(
                              'Câu hỏi ${it.answered}/${it.total} - ${it.lastOpened}',
                              style: AppTheme.body(size: 12, color: kInk),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Expanded(
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(3),
                                    child: LinearProgressIndicator(
                                      value: progress,
                                      minHeight: 4,
                                      backgroundColor: const Color(0xFFE3E5EA),
                                      valueColor: const AlwaysStoppedAnimation(
                                          kIndigo),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '${(progress * 100).round()}%',
                                  style: AppTheme.body(
                                      size: 10, color: kIndigo),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Thẻ đề nổi bật (nền cam nhạt, nhãn Hot).
class FeaturedQuizCard extends StatelessWidget {
  const FeaturedQuizCard({
    super.key,
    required this.title,
    required this.meta,
    this.onTap,
  });

  final String title;
  final String meta;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Material(
        color: const Color(0xFFFBE3CC),
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8C7A0),
                    borderRadius: BorderRadius.circular(99),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.local_fire_department_rounded,
                          size: 14, color: Color(0xFFD2541B)),
                      const SizedBox(width: 2),
                      Text('Hot',
                          style: AppTheme.body(
                              size: 11, color: const Color(0xFFD2541B))),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  title,
                  style: AppTheme.heading(
                    size: 16,
                    color: kInk,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(meta, style: AppTheme.body(size: 12, color: kInk)),
              ],
            ),
          ),
        ),
      );
}
