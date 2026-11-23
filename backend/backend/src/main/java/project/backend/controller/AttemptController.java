package project.backend.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import project.backend.dto.InProgressAttemptDto;
import project.backend.service.AttemptService;

@RestController
@RequestMapping("/api/v1/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptService attemptService;

    /** Bài đang làm dở của chính người đang đăng nhập (lấy id từ token, không nhận id từ app). */
    @GetMapping("/in-progress")
    public List<InProgressAttemptDto> inProgress(@AuthenticationPrincipal Jwt jwt) {
        return attemptService.inProgress(Long.valueOf(jwt.getSubject()));
    }
}
