import { Navigate, Route, Routes } from "react-router-dom";
import { UIProvider } from "../context/UIContext";
import { UserPreferencesProvider } from "../context/UserPreferencesContext";
import AdminResponsiveLayout from "../layouts/AdminResponsiveLayout";
import UserResponsiveLayout from "../layouts/UserResponsiveLayout";
import AdminAnalyticsPage from "../pages/admin/AdminAnalyticsPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminNotificationsPage from "../pages/admin/AdminNotificationsPage";
import AdminQuestionBankPage from "../pages/admin/AdminQuestionBankPage";
import AdminReportsPage from "../pages/admin/AdminReportsPage";
import AdminSecurityPage from "../pages/admin/AdminSecurityPage";
import AdminSettingsPage from "../pages/admin/AdminSettingsPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AppHomePage from "../pages/app-home/AppHomePage";
import CreateQuizPage from "../pages/creator/CreateQuizPage";
import MyQuizzesPage from "../pages/creator/MyQuizzesPage";
import ExamDetailPage from "../pages/exams/ExamDetailPage";
import ExamsDiscoveryPage from "../pages/exams/ExamsDiscoveryPage";
import AttemptProgressDetailPage from "../pages/history/AttemptProgressDetailPage";
import HistoryListPage from "../pages/history/HistoryListPage";
import OnboardingPage from "../pages/onboarding/OnboardingPage";
import ProfilePage from "../pages/profile/ProfilePage";
import QuizPlayerPage from "../pages/quiz/QuizPlayerPage";
import QuizResultPage from "../pages/quiz/QuizResultPage";
import QuizReviewAnswersPage from "../pages/quiz/QuizReviewAnswersPage";
import AiProctoringCheckPage from "../pages/school/AiProctoringCheckPage";
import AssignedExamsPage from "../pages/school/AssignedExamsPage";
import ExamBriefingPage from "../pages/school/ExamBriefingPage";
import ExamSubmittedPage from "../pages/school/ExamSubmittedPage";
import ProctoredExamRoomPage from "../pages/school/ProctoredExamRoomPage";

/**
 * Isolated Web Module Routes mounted under `/*` from `AppRoutes.tsx`.
 * Keeps Landing Page (`/`) and existing AuthContext 100% untouched.
 * All 6 Phases implemented with zero placeholder stubs remaining.
 */
export default function WebModuleRoutes() {
  return (
    <UserPreferencesProvider>
      <UIProvider>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Student Responsive Shell */}
          <Route element={<UserResponsiveLayout />}>
            <Route path="/practice" element={<AppHomePage />} />
            <Route path="/app" element={<AppHomePage />} />

            <Route path="/exam" element={<ExamsDiscoveryPage />} />
            <Route path="/exams" element={<ExamsDiscoveryPage />} />
            <Route path="/exams/subject/:subjectId" element={<ExamsDiscoveryPage />} />
            <Route path="/exams/detail/:quizId" element={<ExamDetailPage />} />

            {/* Phase 4 — Quiz Core, Creator & History */}
            <Route path="/quiz/:quizId" element={<QuizPlayerPage />} />
            <Route path="/quiz/result/:attemptId" element={<QuizResultPage />} />
            <Route path="/quiz/result/:attemptId/review" element={<QuizReviewAnswersPage />} />

            <Route path="/create-quiz" element={<CreateQuizPage />} />
            <Route path="/my-quizzes" element={<MyQuizzesPage />} />

            <Route path="/history" element={<HistoryListPage />} />
            <Route path="/history/:attemptId" element={<AttemptProgressDetailPage />} />

            {/* Phase 6 — School Assigned Exams, 5-Layer AI Proctoring & Profile */}
            <Route path="/school" element={<AssignedExamsPage />} />
            <Route path="/school/exam/:assignedExamId/briefing" element={<ExamBriefingPage />} />
            <Route path="/school/exam/:assignedExamId/proctoring-check" element={<AiProctoringCheckPage />} />
            <Route path="/school/exam/:assignedExamId/room" element={<ProctoredExamRoomPage />} />
            <Route path="/school/exam/:assignedExamId/submitted/:attemptId" element={<ExamSubmittedPage />} />

            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Phase 5 — Admin Responsive Shell (19 Functional Screens) */}
          <Route path="/admin" element={<AdminResponsiveLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage initialTab="USERS" />} />
            <Route path="lecturers" element={<AdminUsersPage initialTab="LECTURERS" />} />
            <Route path="questions" element={<AdminQuestionBankPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
            <Route path="security" element={<AdminSecurityPage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/practice" replace />} />
        </Routes>
      </UIProvider>
    </UserPreferencesProvider>
  );
}
