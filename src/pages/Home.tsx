import { useState } from "react";
import Input from "../components/UIcomponents/Input";
import Button from "../components/UIcomponents/Button";

const Home = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleSubmit = async (e:any) => {
    e.preventDefault()
    
  }

  return (
    <div className="w-screen h-screen flex">
      <div className="p-5 bg-blue-100 flex basis-2/3 justify-center items-center">
        <h1>Administra tu información de forma sencilla</h1>
      </div>
      <div className="p-5 bg-blue-300 flex basis-1/3 justify-center items-center">
        <form onSubmit={handleSubmit} className="p-3 bg-white rounded-lg flex flex-col items-center">
          <h1>Inicia sesión</h1>
          <Input 
            onType={setEmail}
            inputName="Email"
            inputValue={email}
            inputType="text"
          />
          <Input 
            onType={setPassword}
            inputName="Contraseña"
            inputValue={password}
            inputType="password"
          />
          <Button 
            label="Iniciar sesión"
          />
        </form>
      </div>
    </div>
  )
} 

export default Home;