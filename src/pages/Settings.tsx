import { Button, Container } from "react-bootstrap";

export const Settings = () => {
    return (
        <Container>
            <h4 className="mb-3 fw-bold text-primary">Account Settings</h4>
            <Button variant="primary">Connect to Google OAuth</Button>
        </Container>
    )
}