package project.backend.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import project.backend.dto.AuthResponse;
import project.backend.dto.GoogleLoginRequest;
import project.backend.dto.LoginRequest;
import project.backend.dto.RefreshRequest;
import project.backend.dto.UserDto;
import project.backend.service.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/google")
    public AuthResponse google(@Valid @RequestBody GoogleLoginRequest request) {
        return authService.loginWithGoogle(request.idToken());
    }

    @PostMapping("/login")
    public AuthResponse google(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /** Đổi refresh token lấy access token mới (và refresh token mới). */
    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    /** Đăng xuất: thu hồi refresh token. */
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody RefreshRequest request) {
        authService.logout(request.refreshToken());
    }

    /** Lấy người dùng hiện tại từ token (frontend gọi khi mở lại app để biết còn đăng nhập không). */
    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal Jwt jwt) {
        return authService.getCurrentUser(Long.valueOf(jwt.getSubject()));
    }
}
