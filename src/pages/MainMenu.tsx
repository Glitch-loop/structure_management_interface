import MainMenuComponent from "../components/MainMenu/MainMenuComponent";

const MainMenu = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center rounded-r-3xl">
        <div className="bg-white rounded-md p-3">
          <MainMenuComponent />
        </div>
    </div>
  )
}

export default MainMenu;