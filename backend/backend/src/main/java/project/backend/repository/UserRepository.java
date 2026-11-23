package project.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import project.backend.entity.User;
import project.backend.enums.AuthProvider;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByGmail(String gmail);
    Optional<User> findByUsernameIgnoreCase(String username);
    boolean existsByGmail(String gmail);
    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);
}
