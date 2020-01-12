import React, {useState} from 'react';
import {makeStyles} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import DragAndDropComponent from "./DragAndDropComponent";
import FileListComponent from "./FileListComponent";
import {Map} from 'immutable';

const StartJobComponent = () => {
    const styles = useStyles();

    const [files, setFiles] = useState(new Map());

    const handleFilesDropped = (newFiles) => {
        console.log(newFiles);
        let updatedFiles = files;
        Array.from(newFiles).forEach((newFile) => {
            updatedFiles = updatedFiles.set(newFile.path, newFile);
        });
        setFiles(updatedFiles)
    };

    const handleFileDeleted = (file) => {
        setFiles(files.delete(file.path))
    };

    return (
        <div className={styles.root}>
            <Typography className={styles.heading} variant="h1" align="center">Start job</Typography>
            <div className={styles.fileInputContainer}>
                <DragAndDropComponent files={files} onFilesDropped={handleFilesDropped}/>
                <FileListComponent files={files} onFileDeleted={handleFileDeleted}/>
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