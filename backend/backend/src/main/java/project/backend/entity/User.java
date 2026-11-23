package project.backend.entity;

import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import project.backend.enums.AuthProvider;
import project.backend.enums.PackageOwned;
import project.backend.enums.UserRole;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String gmail;
    private String avatarURL;
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider provider = AuthProvider.GOOGLE;

    private String providerId;

    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "package_owned")
    private PackageOwned packageOwned = PackageOwned.FREE;

    @Column(name = "end_date_package")
    private LocalDate endDatePackage;

    @Column(name = "free_access")
    private Integer freeAccess;

    private LocalDateTime createAt = LocalDateTime.now();

    private LocalDateTime changePassAt;

}
