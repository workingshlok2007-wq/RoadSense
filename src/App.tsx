import { RouterProvider } from "react-router"
import { router } from "./app/routes"
import { DemoProvider } from "./context/DemoContext"
import { AuthProvider } from "./context/AuthContext"

export default function App() {
  return (
    <AuthProvider>
      <DemoProvider>
        <RouterProvider router={router} />
      </DemoProvider>
    </AuthProvider>
  )
}
