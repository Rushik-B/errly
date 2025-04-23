import AuthForm from '../components/auth-form'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import '../styles/login.css'

export default function LoginPage() {
  return (
    <div className="login-page">
      {/* Navigation */}
      <div className="nav-container">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
      </div>
      
      {/* Background Elements */}
      <div className="bg-elements">
        <div className="bg-blob1"></div>
        <div className="bg-blob2"></div>
      </div>
      
      {/* Auth Form */}
      <div className="form-container">
        <AuthForm />
      </div>
    </div>
  )
} 