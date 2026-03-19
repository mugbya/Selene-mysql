import { usePanelsStore } from "@/store/usePanelsStore";
import { useRef, useState } from "react";
// import {
//   ImperativePanelHandle,
//   Panel,
//   PanelGroup 
//   PanelResizeHandle,
// } from "react-resizable-panels";
import WorkSpaceTreePanel from "./WorkSpaceTreePanel";
// import EditTabs from "./EditTabs";
import { EditableResultTable } from "./ExecResultTable";
import { ExecResult } from "@/types";
import { EditTabs } from "./EditTabs";
import { ContentTabManager } from "./ContentTabManager";

export default function DataBaseView({ dbKey, databases }: { dbKey: string | null, databases: string[] }) {

  const [execResult, setExecResult] = useState<ExecResult | null>(null);
  // const [execResult, setExecResult] = useState<boolean>(false);

  const showRightPanel = usePanelsStore((s) => s.showRightPanel);
  //  const rightMode = usePanelsStore((s) => s.rightMode);
  const setShowRightPanel = usePanelsStore((s) => s.setShowRightPanel);
  const setShowLeftPanel = usePanelsStore((s) => s.setShowLeftPanel);

  const leftPanelRef = useRef<ImperativePanelHandle>(null);

  return (
    <>
    </>
    // <>
    //   <PanelGroup id="panelGroup" direction="horizontal" className="flex-1">
    //     {/* {showLeftPanel ? ( */}
    //     <>
    //       <Panel
    //         id="left"
    //         order={0}
    //         // onResize={(size) => console.log("Left panel size:", size)}
    //         ref={leftPanelRef}
    //         minSize={10}
    //         defaultSize={20}
    //         collapsible
    //         onCollapse={() => setShowLeftPanel(false)}
    //         onExpand={() => setShowLeftPanel(true)}
    //         className="border border-zinc-300 rounded-md overflow-hidden"
    //       >
    //         {/* 工作区域 - 放目录树 - 避免空projectRootPath路径时渲染 WorkSpaceTreePanel 组件 */}

    //         <div className="flex flex-col h-full">
    //           <WorkSpaceTreePanel
    //             databases = {databases}
    //             dbKey = {dbKey}
    //           />
    //         </div>
    //       </Panel>
    //       <PanelResizeHandle
    //         id="resize-left"
    //         className="w-1 cursor-col-resize"
    //       />
    //     </>
    //     {/* ) : null} */}

    //     {/* 工作区域 - 放文件内容 */}
    //     <Panel
    //       id="main"
    //       order={2} // 明确设置order
    //       // onResize={(size) => console.log("Left panel size:", size)}
    //       minSize={30}
    //     >
    //       {/* <EditTabs dbKey={dbKey}/> */}
    //       <PanelGroup direction="vertical" className="h-full">
    //         {/* 编辑器区域 */}
    //         <Panel defaultSize={70} minSize={20}>
    //           {/* <EditTabs dbKey={dbKey} onExecResult={setExecResult} /> */}
    //           <ContentTabManager dbKey={dbKey} onExecResult={setExecResult} />
    //         </Panel>

    //         {/* 查询结果区域 */}
    //         {execResult && (
    //           <>
    //             <PanelResizeHandle className="h-1 cursor-row-resize"/>

    //             <Panel defaultSize={30} minSize={10}>
    //               <div className="h-full overflow-auto border rounded border-gray-300">
    //                 <EditableResultTable result={execResult} onClose={() => setExecResult(null)}/>
    //               </div>
    //             </Panel>
    //           </>
    //         )}
    //       </PanelGroup>
    //     </Panel>

    //     {/* 右侧面板 */}
    //     {/* {showRightPanel && !isSettingsMode && ( */}
    //     {showRightPanel ? (
    //       <>
    //         <PanelResizeHandle
    //           id="resize-right"
    //           className="w-1 cursor-col-resize"
    //         />
    //         <Panel
    //           id="right"
    //           order={3} // 明确设置order
    //           // onResize={(size) => console.log("Left panel size:", size)}
    //           className="border border-zinc-300 rounded-md overflow-hidden overflow-y-auto"
    //           minSize={10}
    //           defaultSize={25}
    //           collapsible
    //           onCollapse={() => setShowRightPanel(false)}
    //           onExpand={() => setShowRightPanel(true)}
    //         >
    //           <div className=" h-full overflow-hidden">
    //             {/* <RightPanel /> */}
    //           </div>
    //         </Panel>
    //       </>
    //     ) : null}
    //   </PanelGroup>
    // </>
  );
}
