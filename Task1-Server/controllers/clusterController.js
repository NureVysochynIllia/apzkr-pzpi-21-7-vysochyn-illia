const Clusters = require('../models/Clusters');
const Storages = require('../models/Storages');
const Volumes = require("../models/Volumes");
const {translateCluster} = require("../services/translateService");
const Bookings = require("../models/Bookings");
class clusterController {
    async addCluster(request, response){
        try {
            const {name, location, city, type, workTime} = request.body;
            if (!name || !location || !city || !type || !workTime){
                return response.status(400).json({ message: "Error: Some fields is empty"})
            }
            const newCluster = new Clusters({name, location, city, type, workTime});
            await newCluster.save();
            return response.status(201).json({ message: 'Cluster crated successfully.' });
        } catch (error){
            return response.status(500).json({ message: "Cluster creation failed", error: error.message });
        }
    }
    async editCluster(request, response){
        try {
            const {id} = request.params;
            const {name, location, city, type, workTime} = request.body;
            const cluster = await Clusters.findById(id);
            if (!cluster) {
                return response.status(404).json({ message: "Cluster not found." });
            }
            if (name) cluster.name = name;
            if (location) cluster.location = location;
            if (city) cluster.city = city;
            if (type) cluster.type = type;
            if (workTime) cluster.workTime = workTime;
            await cluster.save();
            return response.status(200).json({ message: "Cluster updated successfully." });
        } catch (error) {
            return response.status(500).json({ message: "Failed to update cluster.", error: error.message });
        }
    }
    async deleteCluster(request, response){
        try {
            const {id} = request.params;
            await Clusters.deleteOne({_id:id});
            const storages = await Storages.find({clusterId: id});
            for(let i = 0; i<storages.length;i++){
                await Volumes.deleteMany({ storageId: storages[i]._id });
            }
            await Storages.deleteMany({ clusterId: id});
            return response.status(200).json({ message: "Cluster deleted successfully." });
        } catch (error) {
            return response.status(500).json({ message: "Failed to delete cluster.", error: error.message });
        }
    }
    async getClusters(request, response){
        try {
            const language = request.headers.lang;
            const cluster = await Clusters.find();
            const clusterResp = await Promise.all(cluster.map(cluster=> translateCluster(cluster, language)))
            return response.status(200).json({clusters:clusterResp});
        } catch (error) {
            return response.status(500).json({ message: "Failed to get clusters.", error: error.message });
        }
    }
    async getCluster(request, response){
        try {
            const {id} = request.params;
            const language = request.headers.lang;
            let cluster = await Clusters.findById(id);
            const storages = await Storages.find({clusterId: id});
            const storagesResp = [];
            for (let i = 0; i < storages.length; i++) {
                const volumeInfo = await Volumes.find({ storageId: storages[i]._id });
                const bookings = await Bookings.find({ storageId: storages[i]._id })
                const now = new Date();
                let isOpened = true;
                let isBooked = false;
                for (let booking of bookings) {
                    if (booking.rentalTime.to > now) {
                        isOpened = false;
                        isBooked = true;
                        break;
                    }
                }
                if (isOpened && !storages[i].isOpened) {
                    storages[i].isOpened = true;
                    await storages[i].save();
                }
                storagesResp.push({
                    _id: storages[i]._id,
                    number:storages[i].number,
                    isOpened: storages[i].isOpened,
                    isBooked: isBooked,
                    price:storages[i].price,
                    clusterId:storages[i].clusterId,
                    volumes:volumeInfo.map(volumeInfo=>{return {
                        height:volumeInfo.height,
                        width:volumeInfo.width,
                        length:volumeInfo.length,
                        unit:volumeInfo.unit
                    }}),
                });
            }
            cluster = await translateCluster(cluster, language)
            return response.status(200).json({cluster,storages:storagesResp});
        } catch (error) {
            return response.status(500).json({ message: "Failed to get cluster.", error: error.message });
        }
    }
}
module.exports = new clusterController();