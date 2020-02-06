import React, {useEffect, useState} from 'react';
import {makeStyles} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import DragAndDropComponent from "./DragAndDropComponent";
import FileListComponent from "./FileListComponent";
import {Map} from 'immutable';
import ConnectRoPeerNetworkButton from "./ConnectToPeerNetworkButtonComponent";
import CurrentNetworkListComponent from "./CurrentNetworkListComponent";
import Button from "@material-ui/core/Button";
import ActiveJobsComponent from "../activeJobs/ActiveJobsComponent";

const {ipcRenderer} = require('electron');

const StartJobComponent = () => {
    const styles = useStyles();

    const [files, setFiles] = useState(new Map());
    const [peersList, setPeersList] = useState([]);
    const [selfId, setSelId] = useState(null);

    useEffect(() => {
        document.title = 'P2P Anti Plagiarism App'
    }, []);

    const handleFilesDropped = (newFiles) => {
        let updatedFiles = files;
        Array.from(newFiles).forEach((newFile) => {
            updatedFiles = updatedFiles.set(newFile.path, newFile);
        });
        setFiles(updatedFiles);
    };

    const handleClick = () => {
        console.log('Sending');

        let data = {
            files: []
        };
        files.toIndexedSeq().forEach(((value) => {
            data.files.push({
                name: value.name,
                path: value.path
            })
        }));

        console.log(data);
        ipcRenderer.send('parseFiles', data);
    };

    const handleFileDeleted = (file) => {
        setFiles(files.delete(file.path))
    };

    const fillPeersList = (peers) => {
        let updatedList = [];
        Array.from(peers).forEach((peer) =>
            updatedList.push(peer)
        );
        setPeersList(updatedList);

    };

    const attachSelfId = (peerId) => {
        setSelId(peerId);
    };

    return (
        <div className={styles.root}>
            <Typography className={styles.heading} variant="h1" align="center">Start job</Typography>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <div className={styles.fileInputContainer}>
                    <DragAndDropComponent files={files} onFilesDropped={handleFilesDropped}/>
                    <FileListComponent files={files} onFileDeleted={handleFileDeleted}/>
                    {files.size !== 0 && <Button className={styles.button} variant={"contained"} onClick={handleClick}
                                                 disabled={selfId == null}>
                        Apply
                    </Button>}
                </div>

                <div className={styles.networkList}>
                    <ConnectRoPeerNetworkButton peersList={peersList} fillPeersList={fillPeersList}
                                                attachSelfId={attachSelfId}/>
                    <CurrentNetworkListComponent peersList={peersList} selfId={selfId}/>
                </div>
            </div>


            <ActiveJobsComponent/>


        </div>
    );
};

const useStyles = makeStyles(() => ({
    root: {
        // display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },

    fileInputContainer: {
        alignItems: 'center',
        flex: 3
    },

    heading: {
        fontSize: 20
    },

    networkList: {
        flex: 1,
        flexDirection: 'column',
    },
    button: {
        align: 'center'
    },

}));

export default StartJobComponent;
