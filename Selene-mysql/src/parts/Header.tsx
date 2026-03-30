// import {Button} from "@/components/ui/button";
import {PanelLeft, PanelRight} from 'lucide-react';
import { HeadProps } from "../types";


export default function Head({toggleLeft, toggleRight}: HeadProps) {

    return (
        <div className="flex items-center justify-between px-4 h-14">

            <div className="flex gap-1 items-center">
                <div className="p-1 h-7 w-7"/>
            </div>

            <div className="flex-1"/>

            <div className="flex gap-1">
                {/* <button  onClick={() => window.electronAPI.toggleDevTools()}>
                    切换 DevTools
                </button> */}

                {/* <Button className="p-1 h-7 w-7" variant="ghost" size="sm" onClick={toggleLeft}>
                    <PanelLeft className="w-5 h-5"/>
                </Button>
                <Button className="p-1 h-7 w-7" variant="ghost" size="sm" onClick={toggleRight}>
                    <PanelRight className="w-5 h-5"/>
                </Button> */}

                <div className="p-1 h-7 w-7"/>
            </div>

        </div>
    );
}