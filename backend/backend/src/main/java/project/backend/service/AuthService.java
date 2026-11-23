package project.backend.service;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import lombok.RequiredArgsConstructor;
import project.backend.dto.AuthResponse;
import project.backend.dto.LoginRequest;
import project.backend.dto.UserDto;
import project.backend.entity.User;
import project.backend.enums.AuthProvider;
import project.backend.repository.UserRepository;
import project.backend.security.GoogleTokenVerifier;
import project.backend.security.GoogleTokenVerifier.GoogleUser;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final GoogleTokenVerifier googleVerifier;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse loginWithGoogle(String idToken) {
        GoogleUser g = googleVerifier.verify(idToken);

        // Chỉ tin email nếu chính Google xác nhận email đó đã được xác minh
        if (!g.emailVerified() || g.email() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email Google chưa được xác minh");
        }

        User user = userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, g.sub())
                .or(() -> userRepository.findByGmail(g.email()).map(existing -> link(existing, g)))
                .orElseGet(() -> create(g));

        return toResponse(user, refreshTokenService.issue(user));
    }

    @Transactional // không dùng readOnly, vì phía dưới có ghi refresh token
    public AuthResponse login(LoginRequest req) {
        String id = req.username().trim();

        Optional<User> optionalUser = userRepository.findByUsernameIgnoreCase(id);

        if (optionalUser.isEmpty()) {
            optionalUser = userRepository.findByGmail(id);
        }

        if (optionalUser.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Gmail hoặc mật khẩu không đúng");
        }
        User user = optionalUser.get();

        if (req.password() == null || !passwordEncoder.matches(req.password(), user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Gmail hoặc mật khẩu không đúng");
        }
        String refreshToken = refreshTokenService.issue(user);

        return toResponse(user, refreshToken);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(Long userId) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isPresent()) { // Kiểm tra có tìm thấy ko
            User user = optionalUser.get();
            UserDto userDto = UserDto.from(user); // Chuyển entity thành dto
            return userDto;
        } else {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Tài khoản không còn tồn tại");
        }
    }

    /** Đổi refresh token lấy cặp access + refresh token mới. */
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public AuthResponse refresh(String refreshToken) {
        RefreshTokenService.Rotated r = refreshTokenService.rotate(refreshToken);
        return toResponse(r.user(), r.refreshToken());
    }

    /** Đăng xuất: thu hồi refresh token. */
    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    /**
     * Email đã có tài khoản: gắn tài khoản đó với Google (chỉ khi chưa gắn nhà cung
     * cấp nào).
     */
    private User link(User existing, GoogleUser g) {
        if (existing.getProviderId() == null) {
            existing.setProvider(AuthProvider.GOOGLE);
            existing.setProviderId(g.sub());
        }
        if (existing.getAvatarURL() == null) {
            existing.setAvatarURL(g.picture());
        }
        return existing; // đang trong giao dịch nên Hibernate tự lưu thay đổi
    }

    private User create(GoogleUser g) {
        User u = new User();
        u.setUsername(g.name() != null ? g.name() : g.email());
        u.setGmail(g.email());
        u.setAvatarURL(g.picture());
        u.setProvider(AuthProvider.GOOGLE);
        u.setProviderId(g.sub());
        return userRepository.save(u);
    }

    private AuthResponse toResponse(User user, String refreshToken) {
        return new AuthResponse(jwtService.generate(user), refreshToken, "Bearer",
                jwtService.expiresInSeconds(), UserDto.from(user));
    }

}
