import FormCollaborator from "../components/FormPersons/FormCollaborator";

const AddCollaborator = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
        <div className="bg-white rounded-md p-5">
          <FormCollaborator 
            label={"Agregar nuevo colaborador"}
            action={0}
          />
        </div>
    </div>
  )
}

export default AddCollaborator;