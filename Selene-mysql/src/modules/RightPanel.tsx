// import { Card, CardContent } from "@/components/ui/card"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import {ExtractTocFromMarkdown} from "@/components/common/markdown/ExtractTocFromMarkdown";
// import {useProjectsStore} from "@/store/useProjectStore";


export default function RightPanel() {

    // const { projects, activeProjectId } = useProjectsStore();
    // const currentProject = projects[activeProjectId!];
    // const currentFile = currentProject?.openFiles.find(
    //     (f) => f.path === currentProject.lastActiveFile
    // );
    // if (!currentFile) return null;

    // const markdown = currentFile?.markdown ?? currentFile?.content ?? "";
    // console.log("[RightPanel] markdown", markdown);
    // const toc = ExtractTocFromMarkdown(markdown);


    // function handleScrollToHeading(slug: string) {
    //     // console.log("[RightPanel] handleScrollToHeading", slug);
    //     const el = document.getElementById(slug);
    //     // console.log("[RightPanel] handleScrollToHeading: ", slug, "el: ", el);
    //     if (el) {
    //         el.scrollIntoView({ behavior: "smooth", block: "start" });
    //     }
    // }

    return (

            // <ScrollArea className="h-full p-4">

                <div className="p-4 text-sm space-y-2 overflow-y-auto max-h-full text-left">
                    <h2 className="font-bold mb-2 text-base">目录</h2>
                    <ul className="space-y-1">
                       
                    </ul>
                </div>

            // </ScrollArea>
        // <aside className="w-60  overflow-auto">
        // </aside>
    )
}