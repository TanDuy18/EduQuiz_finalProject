import {Route, Routes} from "react-router-dom";  
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/home/HomePage";
import WebModuleRoutes from "./WebModuleRoutes";
export default function AppRoutes(){
    return(
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage/>}/> 
            </Route>
            <Route path="/*" element={<WebModuleRoutes />}/>
        </Routes>
    );
}
