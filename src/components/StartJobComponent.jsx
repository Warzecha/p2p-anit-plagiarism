import React, {useState} from 'react';
import {makeStyles} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import DragAndDropComponent from "./DragAndDropComponent";
import FileListComponent from "./FileListComponent";

const StartJobComponent = () => {
    const styles = useStyles();

    const [files, setFiles] = useState([]);

    const handleFilesDropped = (newFiles) => {
        setFiles([...files, ...newFiles])
    };

    return (
        <div className={styles.root}>
            <Typography className={styles.heading} variant="h1" align="center">Start job</Typography>
            <div className={styles.fileInputContainer}>
                <DragAndDropComponent files={files} onFilesDropped={handleFilesDropped}/>
                <FileListComponent files={files}/>
            </div>

        </div>
    );
};

const useStyles = makeStyles(() => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },

    fileInputContainer: {
        width: '80%'
    },

    heading: {
        fontSize: 20
    }

}));

export default StartJobComponent;