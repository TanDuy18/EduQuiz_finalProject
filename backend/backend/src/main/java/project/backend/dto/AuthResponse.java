package project.backend.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,      // số giây access token còn hiệu lực
        UserDto user) {
}
