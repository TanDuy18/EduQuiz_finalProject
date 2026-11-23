import 'package:eduquiz/core/theme/app_theme.dart';
import 'package:eduquiz/features/auth/providers/auth_controller.dart';
import 'package:eduquiz/features/home/widgets/bottom_nav.dart';
import 'package:eduquiz/features/home/widgets/home_theme.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../widgets/exam_card.dart';

// TODO: thay bằng dữ liệu từ API (backend chưa có điểm đánh giá và lượt làm)
const _all = [
  ExamItem(title: 'Đề thi thử Toán THPT 2025', subject: 'Toán', questions: 50, minutes: 90, rating: '4,8', ratingCount: '1.2k', plays: '12,4k', popular: true),
  ExamItem(title: 'Vật lý 12 - Dao động cơ', subject: 'Vật lý', questions: 40, minutes: 90, rating: '4,6', ratingCount: '860', plays: '8,9k'),
  ExamItem(title: 'Ngữ văn 12 - Nghị luận xã hội', subject: 'Ngữ văn', questions: 30, minutes: 60, rating: '4,5', ratingCount: '640', plays: '5,1k'),
  ExamItem(title: 'Hoá học 11 - Cân bằng hoá học', subject: 'Hoá học', questions: 35, minutes: 45, rating: '4,7', ratingCount: '720', plays: '6,3k', popular: true),
];

const _subjects = ['Tất cả', 'Toán', 'Ngữ văn', 'Hoá học', 'Vật lý', 'Ngoại ngữ', 'Lịch sử'];

class ExamsPage extends ConsumerStatefulWidget {
  const ExamsPage({super.key});

  @override
  ConsumerState<ExamsPage> createState() => _ExamsPageState();
}

class _ExamsPageState extends ConsumerState<ExamsPage> {
  final _search = TextEditingController();
  String _subject = 'Tất cả';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  List<ExamItem> get _filtered {
    final q = _search.text.trim().toLowerCase();
    return _all.where((e) {
      final okSubject = _subject == 'Tất cả' || e.subject == _subject;
      final okText = q.isEmpty ||
          e.title.toLowerCase().contains(q) ||
          e.subject.toLowerCase().contains(q);
      return okSubject && okText;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final avatar = ref.watch(authControllerProvider).value?.avatarUrl;
    final items = _filtered;

    return Scaffold(
      backgroundColor: kPageBg,
      bottomNavigationBar: AppBottomNav(
        currentIndex: 2,
        avatarUrl: avatar,
        onTap: (i) {
          if (i != 2) AppBottomNav.goTo(context, i);
        },
      ),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 16),
                children: [
                  Align(
                    alignment: Alignment.centerRight,
                    child: InkWell(
                      onTap: () {}, // TODO: mở "Đề của tôi"
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text(
                          'Đề của tôi',
                          style: AppTheme.heading(
                            size: 14,
                            color: const Color(0xFF000DFF),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 56),
                  Text(
                    'Đề thi',
                    style: AppTheme.heading(
                      size: 30,
                      color: Colors.black,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Chọn một đề và bắt đầu luyện tập',
                    style: AppTheme.body(
                      size: 16,
                      color: Colors.black.withValues(alpha: 0.8),
                    ),
                  ),
                  const SizedBox(height: 32),
                  Container(
                    height: 52,
                    alignment: Alignment.centerLeft,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x40000000),
                          offset: Offset(0, 4),
                          blurRadius: 4.5,
                        ),
                      ],
                    ),
                    child: TextField(
                      controller: _search,
                      onChanged: (_) => setState(() {}),
                      style: AppTheme.body(size: 16, color: Colors.black),
                      decoration: InputDecoration(
                        isDense: true,
                        hintText: 'Tìm theo tên đề và môn học',
                        hintStyle: AppTheme.body(
                          size: 16,
                          color: Colors.black.withValues(alpha: 0.3),
                        ),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 16),
                      ),
                    ),
                  ),
                  const SizedBox(height: 19),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    clipBehavior: Clip.none,
                    child: Row(
                      children: [
                        for (final s in _subjects)
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: _FilterChip(
                              label: s,
                              selected: s == _subject,
                              style: kSubjectStyles[s],
                              onTap: () => setState(() => _subject = s),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 22),
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Đề có sẵn',
                          style: AppTheme.heading(
                            size: 18,
                            color: Colors.black,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () {}, // TODO: bộ lọc nâng cao
                        tooltip: 'Bộ lọc',
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints.tightFor(
                            width: 28, height: 28),
                        icon: const Icon(Icons.tune_rounded,
                            size: 24, color: Color(0xFF6B7280)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  if (items.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 40),
                      child: Center(
                        child: Text(
                          'Không tìm thấy đề phù hợp.',
                          style: AppTheme.body(
                              size: 14, color: const Color(0xFF676767)),
                        ),
                      ),
                    )
                  else
                    for (var i = 0; i < items.length; i++) ...[
                      if (i > 0) const SizedBox(height: 21),
                      ExamCard(
                        exam: items[i],
                        onTap: () {}, // TODO: mở chi tiết / bắt đầu làm đề
                      ),
                    ],
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
              child: SizedBox(
                width: double.infinity,
                height: 44,
                child: FilledButton(
                  onPressed: () {}, // TODO: mở màn tạo Quiz
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF52A2FF),
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.zero,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                  ),
                  child: Text(
                    'Tạo Quiz',
                    style: AppTheme.heading(
                      size: 20,
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Đang chọn: nền xanh #319BFF chữ trắng. Chưa chọn: màu pastel của môn (Tất cả thì xám nhạt).
class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.style,
  });

  final String label;
  final bool selected;
  final SubjectStyle? style;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final bg = selected
        ? const Color(0xFF319BFF)
        : (style?.chip ?? const Color(0xFFE3E7F0));
    final fg = selected ? Colors.white : (style?.chipText ?? Colors.black);

    return Semantics(
      button: true,
      selected: selected,
      label: label,
      child: Material(
        color: bg,
        shape: const StadiumBorder(),
        child: InkWell(
          customBorder: const StadiumBorder(),
          onTap: onTap,
          child: SizedBox(
            height: 25,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Center(
                child: Text(label, style: AppTheme.body(size: 11, color: fg)),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
