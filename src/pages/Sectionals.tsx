import { useEffect, useState } from "react";
import SectionalManageComponent from "../components/Sectionals/SectionalManageComponent";
import Forbbiden from "../components/Authorization/Forbbiden";
import requester from "../helpers/Requester";

const SectionalsManage = () => {
  const [access, setAccess] = useState<boolean|undefined>(undefined);

  useEffect(() => {
    requester({url: '/privileges/user/[34]', method: "GET"})
    .then(response => {
      setAccess(response.data.privilege)
    })
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
        <div className="bg-white overflow-y-auto rounded-md p-3">
          {access ?
            <SectionalManageComponent /> :
            <Forbbiden />
          }
        </div>
    </div>
  )
}

export default SectionalsManage;