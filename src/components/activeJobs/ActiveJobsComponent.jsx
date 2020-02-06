import React, {useState} from 'react';
import {makeStyles} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import {Map} from 'immutable';
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import List from "@material-ui/core/List";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";

const {ipcRenderer} = require('electron');


const ActiveJob = (props) => {
    const {job} = props;
    return (
        <TableRow>
            <TableCell component="th" scope="row">
                {job.jobId}
            </TableCell>
            <TableCell align="right">{`${Math.floor(job.progress * 100)}%`}</TableCell>
            <TableCell align="right">{'-'}</TableCell>
        </TableRow>)
};

const ActiveJobsComponent = (props) => {

    const styles = useStyles();

    const [jobs, setJobs] = useState(new Map());

    ipcRenderer.on('newJobEvent', (event, args) => {
        // event.stopPropagation();
        setJobs(jobs.set(args.job.jobId, {...args.job, progress: 0}))
    });

    ipcRenderer.on('jobProgressEvent', (event, args) => {
        // event.stopPropagation();
        console.log('jobProgressEvent', args);

        let newJob = {
            ...jobs.get(args.job.jobId),
            progress: args.progressEvent.progress
        };

        // setJobs(jobs.set(args.job.jobId, newJob))
    });

    return (
        <div className={styles.root}>
            <Typography className={styles.heading} variant="h1" align="center">Active Jobs</Typography>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Job</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell>Score</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {jobs.toIndexedSeq().map((job, index) => <ActiveJob job={job} key={index}/>)}
                </TableBody>
            </Table>

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
        width: '60%',
        float: 'left',
        alignItems: 'center',
        marginLeft: '5%'
    },

    heading: {
        fontSize: 20
    },

    networkList: {
        display: 'flex',
        spacing: '10%',
        alignItems: 'center',
        flexDirection: 'column',
        float: 'right',
        width: '30%'
    },
    button: {
        align: 'center'
    },

}));

export default ActiveJobsComponent;
