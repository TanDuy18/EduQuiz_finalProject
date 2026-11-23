package project.backend.dto;

import java.time.LocalDate;

import project.backend.entity.User;
import project.backend.enums.PackageOwned;
import project.backend.enums.UserRole;

/** Thông tin người dùng trả về cho frontend. Không bao giờ chứa mật khẩu. */
public record UserDto(
        Long id,
        String username,
        String gmail,
        String avatarUrl,
        UserRole role,
        PackageOwned packageOwned,
        LocalDate endDatePackage,
        Integer freeAccess) {

    public static UserDto from(User u) {
        return new UserDto(u.getId(), u.getUsername(), u.getGmail(), u.getAvatarURL(),
                u.getRole(), u.getPackageOwned(), u.getEndDatePackage(), u.getFreeAccess());
    }
}
