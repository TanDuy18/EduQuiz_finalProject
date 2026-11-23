import 'package:eduquiz/core/theme/app_colors.dart';
import 'package:eduquiz/core/theme/app_theme.dart';
import 'package:eduquiz/features/onboarding/widgets/primary_button.dart';
import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_controller.dart';
import 'widgets/blurred_home_backdrop.dart';
import 'widgets/google_sign_in_button.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _idCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _passwordMode = false; // false: Google, true: gmail + mật khẩu (test)
  bool _hidePass = true;

  @override
  void dispose() {
    _idCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _googleSignIn() async {
    final ok =
        await ref.read(authControllerProvider.notifier).signInWithGoogle();
    if (ok && mounted) context.go('/home');
  }

  Future<void> _passwordSignIn() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;
    final ok = await ref.read(authControllerProvider.notifier).signInWithPassword(
          identifier: _idCtrl.text.trim(),
          password: _passCtrl.text,
        );
    if (ok && mounted) context.go('/home');
  }

  InputDecoration _decoration(String hint, {Widget? suffix}) => InputDecoration(
        hintText: hint,
        hintStyle: AppTheme.body(size: 14, color: AppColors.textMuted),
        suffixIcon: suffix,
        filled: true,
        fillColor: const Color(0xFFF4F7FF),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.accentBlue, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.redAccent),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Colors.redAccent, width: 1.5),
        ),
      );

  Widget _googleSection(bool loading) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (loading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 13),
            child: Center(
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2.5),
              ),
            ),
          )
        else
          GoogleSignInButton(onPressed: _googleSignIn),
        // Chỉ hiện khi chạy debug, bản phát hành sẽ không có nút này
        if (kDebugMode) ...[
          const SizedBox(height: 8),
          TextButton(
            onPressed: loading ? null : () => setState(() => _passwordMode = true),
            child: Text(
              'Đăng nhập bằng Gmail và mật khẩu (test)',
              style: AppTheme.body(size: 13, color: AppColors.accentBlue),
            ),
          ),
        ],
      ],
    );
  }

  Widget _passwordSection(bool loading) {
    return Form(
      key: _formKey,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextFormField(
            controller: _idCtrl,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autocorrect: false,
            decoration: _decoration('Gmail hoặc tên đăng nhập'),
            validator: (v) =>
                (v == null || v.trim().isEmpty) ? 'Nhập gmail hoặc tên đăng nhập' : null,
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _passCtrl,
            obscureText: _hidePass,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _passwordSignIn(),
            decoration: _decoration(
              'Mật khẩu',
              suffix: IconButton(
                icon: Icon(
                  _hidePass
                      ? Icons.visibility_off_rounded
                      : Icons.visibility_rounded,
                  color: AppColors.navyMuted,
                  size: 20,
                ),
                onPressed: () => setState(() => _hidePass = !_hidePass),
              ),
            ),
            validator: (v) =>
                (v == null || v.isEmpty) ? 'Nhập mật khẩu' : null,
          ),
          const SizedBox(height: 18),
          PrimaryButton(
            label: loading ? 'Đang đăng nhập…' : 'Đăng nhập',
            onPressed: loading ? null : _passwordSignIn,
          ),
          const SizedBox(height: 4),
          TextButton(
            onPressed: loading ? null : () => setState(() => _passwordMode = false),
            child: Text(
              'Quay lại đăng nhập bằng Google',
              style: AppTheme.body(size: 13, color: AppColors.accentBlue),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final loading = ref.watch(authControllerProvider).isLoading;

    ref.listen(authControllerProvider, (_, next) {
      if (next.hasError) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(next.error.toString())));
      }
    });

    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const BlurredHomeBackdrop(),
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding:
                    const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
                child: Container(
                  padding: const EdgeInsets.fromLTRB(22, 28, 22, 20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.12),
                        blurRadius: 30,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Đăng nhập',
                        textAlign: TextAlign.center,
                        style: AppTheme.heading(
                          size: 22,
                          color: AppColors.navy,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Vui lòng đăng nhập để trải nghiệm dịch vụ',
                        textAlign: TextAlign.center,
                        style: AppTheme.body(
                          size: 14,
                          color: AppColors.navyMuted,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 22),
                      AnimatedSwitcher(
                        duration: const Duration(milliseconds: 200),
                        child: KeyedSubtree(
                          key: ValueKey(_passwordMode),
                          child: _passwordMode
                              ? _passwordSection(loading)
                              : _googleSection(loading),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
