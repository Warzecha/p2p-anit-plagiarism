import React, {useEffect, useState} from 'react';
import {makeStyles} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import DragAndDropComponent from "./DragAndDropComponent";
import FileListComponent from "./FileListComponent";
import {Map} from 'immutable';
import CurrentNetworkListComponent from "./CurrentNetworkListComponent";
import Button from "@material-ui/core/Button";
import ActiveJobsComponent from "../activeJobs/ActiveJobsComponent";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

const {ipcRenderer} = require('electron');

const StartJobComponent = () => {
    const styles = useStyles();

    const [files, setFiles] = useState(new Map());
    const [peersList, setPeersList] = useState([]);
    const [selfId, setSelId] = useState(null);

    const [strategy, setStrategy] = React.useState('wiki');

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
            files: [],
            strategy: strategy
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

    const handleChange = event => {
        setStrategy(event.target.value);
    };

    return (
        <div className={styles.root}>
            <Typography className={styles.heading} variant="h1" align="center">Start job</Typography>
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <div className={styles.fileInputContainer}>
                    <DragAndDropComponent files={files} onFilesDropped={handleFilesDropped}/>
                    <FileListComponent files={files} onFileDeleted={handleFileDeleted}/>

                    <div style={{display: 'flex', justifyContent: 'space-around'}}>
                        <FormControl>
                            <InputLabel>Strategy</InputLabel>
                            <Select
                                value={strategy}
                                onChange={handleChange}
                            >
                                <MenuItem value={'wiki'}>Wikipedia</MenuItem>
                                <MenuItem value={'bing'}>Bing Search</MenuItem>
                            </Select>
                        </FormControl>

                        <div>
                            {files.size !== 0 &&
                            <Button className={styles.button} variant={"contained"} onClick={handleClick}
                                    disabled={selfId == null}>
                                Apply
                            </Button>}
                        </div>

                    </div>
                </div>

                <CurrentNetworkListComponent peersList={peersList} selfId={selfId} fillPeersList={fillPeersList}
                                             attachSelfId={attachSelfId} className={styles.networkList}/>
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
        alignItems: 'center',
        justifyItems: 'center'
    },
    button: {
        align: 'center'
    },

}));

export default StartJobComponent;
