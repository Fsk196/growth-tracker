import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthPage } from './routes/AuthPage'
import { BoardsPage } from './routes/BoardsPage'
import { ProjectsPage } from './routes/ProjectsPage'
import { ProjectTasksPage } from './routes/ProjectTasksPage'
import { LearningsPage } from './routes/LearningsPage'
import { SkillGapsPage } from './routes/SkillGapsPage'
import { WinsPage } from './routes/WinsPage'
import { DashboardPage } from './routes/DashboardPage'
import { ProfilePage } from './routes/ProfilePage'
import { SettingsPage } from './routes/SettingsPage'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/boards"
          element={
            <ProtectedRoute>
              <BoardsPage />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId" element={<ProjectTasksPage />} />
          <Route path="/learnings" element={<LearningsPage />} />
          <Route path="/skill-gaps" element={<SkillGapsPage />} />
          <Route path="/wins" element={<WinsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/boards" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
