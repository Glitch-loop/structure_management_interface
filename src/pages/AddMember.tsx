import FormPerson from "../components/FormPersons/FormPerson";

const AddMember = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
        <div className="bg-white rounded-md p-3">
          <FormPerson 
            label={"Agregar nuevo miembro"}
            action={0}
          />
        </div>
        
    </div>
  )
}

export default AddMember;