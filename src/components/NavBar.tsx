import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { useAuth } from "../auth/AuthContext";

export const NavBar = () => {
  const { user, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch('https://devapi.mbfcorp.tools/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed', error);
    }
  }

  return (
    <Navbar expand="sm" className="navbar primary mb-3">
      <Container fluid>
        <Navbar.Brand href="/">Demo Solutions Toolkit</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        {isAuthenticated && user ? (
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <NavDropdown title={`Hi, ${user.firstName} 👋`} id="basic-nav-dropdown">
                <NavDropdown.Item onClick={() => window.location.href = '/settings'}>Settings</NavDropdown.Item>
                <NavDropdown.Item onClick={handleLogout}>Log Out</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        ) : null}
      </Container>
    </Navbar>
  )
}