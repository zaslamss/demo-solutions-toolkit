import { useEffect, useState } from "react";
import { Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

interface SmartsheetInstance {
  id: string;
  name: string;
  abbreviation: string;
  authUrl: string;
  apiBase: string;
}

function Login() {
  const [instances, setInstances] = useState<SmartsheetInstance[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/smartsheet-instances');
        const instanceData = await response.json();
        setInstances(instanceData);
      } catch (error) {
        console.log("Error: ", error)
      };

    }
    fetchData();
  }, []);

  return (
    <Container fluid>
      <p>Welcome to the Demo Solutions Toolkit. <br></br>This site is available to all Smartsheet employees. <br></br>You must log in with your @smartsheet.com or @demo.mbfcorp.com email address to access this site. <br></br>Please do not share this with customers.</p>
      <p>Select the Smartsheet Instance you'd like to log in with:</p>
      {instances.map((instance) => (
        <Link to={`${instance.authUrl}${instance.id}`} key={instance.id}><Button>{`Log in with ${instance.name}`}</Button></Link>
      ))}
    </Container>
  )
}

export default Login
