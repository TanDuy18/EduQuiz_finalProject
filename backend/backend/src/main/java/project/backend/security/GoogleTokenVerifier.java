package project.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class GoogleTokenVerifier {

    private static final String GOOGLE_JWK_URI = "https://www.googleapis.com/oauth2/v3/certs";
    private final NimbusJwtDecoder decoder;

    public record GoogleUser(String sub, String email, boolean emailVerified, String name, String picture) {
    }

    public GoogleTokenVerifier(@Value("${app.google.client-id}") String clientId) {
        NimbusJwtDecoder d = NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWK_URI).build();

        OAuth2TokenValidator<Jwt> issuer = jwt -> {
            String iss = jwt.getClaimAsString("iss");

            boolean ok = "https://accounts.google.com".equals(iss) || "accounts.google.com".equals(iss);

            return ok ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(
                            new OAuth2Error(
                                    "invalid_token",
                                    "Sai nơi phát hành token",
                                    null));
        };

        OAuth2TokenValidator<Jwt> audience = jwt -> {
            boolean ok = jwt.getAudience() != null && jwt.getAudience().contains(clientId);

            return ok ? OAuth2TokenValidatorResult.success()
                    : OAuth2TokenValidatorResult.failure(new OAuth2Error("Invalid token", "Sai nơi phát hành", null));
        };
        d.setJwtValidator(new DelegatingOAuth2TokenValidator<>(new JwtTimestampValidator(), issuer, audience));

        this.decoder = d;
    }

    public GoogleUser verify(String idToken) {
        try {
            Jwt jwt = decoder.decode(idToken);
            return new GoogleUser(
                    jwt.getSubject(),
                    jwt.getClaimAsString("email"),
                    Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified")),
                    jwt.getClaimAsString("name"),
                    jwt.getClaimAsString("picture"));
        } catch (JwtException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google token không hợp lệ hoặc đã hết hạn");
        }
    }

}
