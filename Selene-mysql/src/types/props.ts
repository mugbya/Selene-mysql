export interface MenuPanelProps {
    openSettings: () => void;
    toggleLeft: () => void;
}

export interface HeadProps {
    toggleLeft: () => void;
    toggleRight: () => void;
}

export interface WorkspaceTreeProps {
    connestionId: string,
    // databaseList: string[],
}


