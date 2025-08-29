import { Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

export const Settings = () => {
    const googleOAuthUrl = import.meta.env.VITE_GOOGLE_OAUTH_URL

    return (
        <Container>
            <h4 className="mb-3 fw-bold text-primary">Account Settings</h4>
            <Link style={{textDecoration: 'none'}} to={googleOAuthUrl}><Button variant="primary">Connect to Google OAuth</Button></Link>
        </Container>
    )
}