import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { useAuth } from "../auth/AuthContext";

export default function NavBar() {
  const { user, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed', error);
    }
  }

  return (
    <Navbar expand="sm" className="bg-body-secondary mb-3">
      <Container fluid>
        <Navbar.Brand href="/">Demo Solutions Toolkit</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        {isAuthenticated && user ? (
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto"> {/* Ensures dropdown moves to the right */}
              <NavDropdown title={user.email} id="basic-nav-dropdown">
                <NavDropdown.Item href="#settings">Settings</NavDropdown.Item>
                <NavDropdown.Item onClick={handleLogout}>Log Out</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        ) : null}
      </Container>
    </Navbar>
  )
}