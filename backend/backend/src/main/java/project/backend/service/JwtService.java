package project.backend.service;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import project.backend.entity.User;

@Service
public class JwtService {
    private final JwtEncoder encoder;
    private final Duration ttl;

    public JwtService(JwtEncoder encoder, @Value("${app.jwt.expiration-minutes}") long minutes) {
        this.encoder = encoder;
        this.ttl = Duration.ofMinutes(minutes);
    }

    public String generate(User user) { // Create JWT for 1 person
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("eduquiz")
                .issuedAt(now)
                .expiresAt(now.plus(ttl))
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getGmail())
                .claim("role", user.getRole().name())
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    public long expiresInSeconds() {
        return ttl.toSeconds();
    }
}
