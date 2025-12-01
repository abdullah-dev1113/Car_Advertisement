const user = require("../Models/Users.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Role = require("../Models/roles.model");
// const SECRET_Key = "Abdullah";

class userhandler {
    constructor() { }


    async getAll(req, res) {
        try {
            const found = await user.find();
            if (!found) return res.status(404).json({ msg: "user is not found" });
            return res.status(200).json({ "Found": found });
        } catch (error) {
            return res.status(500).json({ "error founding problem": error });
        }
    }


    async getById(req, res) {
        try {
            const id = req.params.id;
            const found = await user.findById(id);
            if (!found) return res.status(404).json({ msg: "user is not found" });
            return res.status(200).json({ "Found": found });
        } catch (error) {
            return res.status(500).json({ "error id fetching problem": error });
        }
    };


    async login(req, res) {

        try {
            const currentUser = await user.findOne({ "email": req.body.email }).populate("role");

            if (currentUser) {
                if (await bcrypt.compare(req.body.password, currentUser.password)) {
                    const key = process.env.SECRET_KEY;
                    const payload = { _id: currentUser._id  , role: currentUser.role};
                    const expiresInSeconds = Number(process.env.JWT_TOKEN_EXPIRES_IN);
                    const token = jwt.sign(
                        payload,
                        key,
                        { expiresIn: expiresInSeconds }
                    );
                    res.header(
                        process.env.JWT_TOKEN_HEADER,
                        token
                    );
                    return res.status(200).json({ token: token, user: currentUser });
                }
            }
            res.status(404).json({ message: "invalid email or password" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "authentication failed" });
        }
    }


    async CreateUser(req, res) {
        try {
            const { name, email, password, contact, birthDate, role , image , address} = req.body;
            
            const hashedPassword = await bcrypt.hash(password, 10);
            const created = await user.create({ name , email, "password": hashedPassword,  contact, birthDate ,  role , image , address});
            const token = jwt.sign({ email, "id": created._id }, process.env.SECRET_KEY);
            if (!created) return res.status(404).json({ msg: "user is not created" });
            return res.status(200).json({ created, token });
        } catch (error) {
            console.error("signup error ===>", error);
            
            return res.status(500).json({ " error creating problem": error.message });
        }
    };


    async updated(req, res) {        
        try {      
            
            const id = req.params.id;
            
            if(typeof req.body.role === "string"){
                const roleDoc = await Role.findOne({Name: new RegExp(`^${req.body.role}$` , 'i')});
                if (roleDoc) {
                    req.body.role = roleDoc._id;
                }else{
                    console.log("role not found:" , req.body.role);
                    
                    return res.status(400).json({msg: "invalid role string"});
                }
            }

             const {name, email, contact , birthDate , role } = req.body;

            const updated = await user.findByIdAndUpdate(req.params.id, { name , email, contact ,  birthDate , role }, { new: true });

            if (!updated) return res.status(404).json({ msg: "user is not updated" });

            const key = process.env.SECRET_KEY;
            const payload = {_id: updated._id, role: updated.role};
            const expiresInSeconds = Number(process.env.JWT_TOKEN_EXPIRES_IN);
            const token = jwt.sign(payload,key, {expiresIn: expiresInSeconds});

            return res.status(200).json({ 
                success: true,
                token,
                msg: "user updated successfully",
                user: updated ,
             });
        } catch (error) {
            // console.log("update error===>",error);
            console.error("update error:" , error.message);
            
            return res.status(500).json({ "error updating problem": error });
        }
    };

    async deleteUser(req, res) {
        try {
            const id = req.params.id;

            const deleted = await user.findByIdAndDelete(id);
            if (!deleted) return res.status(404).json({ msg: "user is not deleted" });
            return res.status(200).json({ " user deleted": deleted });
        } catch (error) {
            return res.status(500).json({ "error deleting problem": error.message });
        }
    };





}

const userHandler = new userhandler();

module.exports = userHandler;