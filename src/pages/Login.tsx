import { useEffect, useState } from "react";
import { Button, Card, Container, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";

interface SmartsheetInstance {
  id: string;
  name: string;
  abbreviation: string;
  authUrl: string;
  apiBase: string;
}

export const Login = () => {
  const [instances, setInstances] = useState<SmartsheetInstance[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://devapi.mbfcorp.tools/smartsheet-instances');
        const instanceData = await response.json();
        setInstances(instanceData);
      } catch (error) {
        console.log("Error: ", error)
      };
    }
    fetchData();
  }, []);

  return (
    <Container fluid style={{ background: 'linear-gradient(90deg, #EAE3FF 0%, #F2F6FF 100%)', minHeight: '100vh' }} className="vh-100 d-flex flex-column justify-content-center align-items-center">
      <Card className="p-4 shadow text-center">
        <Card.Title>WELCOME 👋</Card.Title>
        <Card.Text>The Demo Solutions Toolkit is available to all <strong>Smartsheet</strong> employees only.</Card.Text>
        <Card.Text>Please log in with your corporate or MBFCorp email to continue.</Card.Text>
        {instances.length > 0 ? instances.map((instance) => {
          if (instance.abbreviation === 'us') {
            return (
              <Link className="d-grid" style={{textDecoration: 'none'}} to={`${instance.authUrl}${instance.id}`} key={instance.id}><Button>Log in with Smartsheet</Button></Link>
            )
          }
        }) : <div><Spinner animation="border" variant="primary" /></div>}
      </Card>
    </Container>
  )
}
