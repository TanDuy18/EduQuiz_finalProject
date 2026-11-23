package project.backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import lombok.extern.slf4j.Slf4j;
import project.backend.entity.RefreshToken;
import project.backend.entity.User;
import project.backend.repository.RefreshTokenRepository;

@Slf4j
@Service
public class RefreshTokenService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final RefreshTokenRepository repo;
    private final Duration ttl;

    /** Kết quả của việc đổi token: user + refresh token mới (bản gốc, chưa băm). */
    public record Rotated(User user, String refreshToken) {
    }

    public RefreshTokenService(RefreshTokenRepository repo,
            @Value("${app.jwt.refresh-expiration}") Duration days) {
        this.repo = repo;
        this.ttl = days;
    }

    /** Tạo refresh token mới cho user. Trả về chuỗi gốc để gửi cho app (DB chỉ lưu bản băm). */
    @Transactional
    public String issue(User user) {
        byte[] bytes = new byte[48];
        RANDOM.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        RefreshToken t = new RefreshToken();
        t.setUser(user);
        t.setTokenHash(hash(raw));
        t.setExpiresAt(Instant.now().plus(ttl));
        repo.save(t);
        return raw;
    }

    /**
     * Đổi refresh token cũ lấy token mới (mỗi token chỉ dùng được 1 lần).
     * Nếu token đã bị dùng rồi mà còn bị gửi lại => nghi bị lộ, thu hồi hết của user đó.
     * noRollbackFor: để việc thu hồi vẫn được lưu dù sau đó ném lỗi 401.
     */
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public Rotated rotate(String raw) {
        RefreshToken old = repo.findByTokenHash(hash(raw)).orElseThrow(RefreshTokenService::unauthorized);

        if (old.isRevoked()) {
            repo.revokeAllByUser(old.getUser());
            throw unauthorized();
        }
        if (old.getExpiresAt().isBefore(Instant.now())) {
            throw unauthorized();
        }

        old.setRevoked(true);
        User user = old.getUser();
        log.info("[AUTH] Đã đổi refresh token cho user {}", user.getId());
        return new Rotated(user, issue(user));
    }

    /** Đăng xuất: thu hồi refresh token này (không báo lỗi nếu không tìm thấy). */
    @Transactional
    public void revoke(String raw) {
        repo.findByTokenHash(hash(raw)).ifPresent(t -> t.setRevoked(true));
    }

    private static ResponseStatusException unauthorized() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập đã hết hạn, hãy đăng nhập lại");
    }

    private static String hash(String raw) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
