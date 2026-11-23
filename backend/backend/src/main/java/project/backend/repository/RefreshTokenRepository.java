package project.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import project.backend.entity.RefreshToken;
import project.backend.entity.User;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /** Thu hồi mọi refresh token còn hiệu lực của một người dùng. */
    @Modifying
    @Query("update RefreshToken t set t.revoked = true where t.user = :user and t.revoked = false")
    int revokeAllByUser(@Param("user") User user);
}
