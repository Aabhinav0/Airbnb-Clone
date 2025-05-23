const Listing=require("../models/listing");
const mbxGeocoding= require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken=process.env.MAP_TOKEN;

const geocodingClient = mbxGeocoding({ accessToken: mapToken });


module.exports.index=async (req,res)=>{
    const allListings=await Listing.find({});
    
    res.render("./listings/index.ejs",{allListings});
}

module.exports.rendernewForm=(req,res)=>{
    res.render("./listings/new.ejs");   
};

module.exports.showlisting=async (req,res)=>{
    let {id}=req.params;
    const listing=await Listing.findById(id).populate({path:"review",populate:{path:"author"},})
    .populate("owner");

    if(!listing){
        req.flash("error","Listing you requested does not exist");
        res.redirect("/listings")
    }
    
    res.render("./listings/show.ejs",{listing});
};

module.exports.createListing=async (req,res)=>{

      let response=await geocodingClient.forwardGeocode({query:req.body.listing.location,limit:1}).send();

        let url=req.file.path;
        let filename=req.file.filename;
        const {title,description,image,price,country}=req.body.listing;
        const listing=new Listing({title,description,image,price,country});
        listing.owner=req.user._id;
        listing.image={url,filename};

        listing.geometry=response.body.features[0].geometry;

        await listing.save();
       
        req.flash("success","New Listing Created!");
        res.redirect("/listings");
};

module.exports.editListing=async (req,res)=>{
        let {id}=req.params;
        const listing= await Listing.findById(id);

        if(!listing){
            req.flash("error","Listing you requested does not exist");
            res.redirect("/listings")
        }
        let originalImageurl=listing.image.url;
        originalImageurl=originalImageurl.replace("/uploads","/uploads/w_250");
        
        res.render("./listings/edit.ejs",{listing,originalImageurl});
};

module.exports.updateListing= async (req,res)=>{
    
        // if(!req.body.listing){
        //     throw new ExpressError(400,"Send some data for listing");
        // }
    
        let {id}=req.params;
        
        let listing=await Listing.findByIdAndUpdate(id,{...req.body.listing});

        if(typeof req.file!=="undefined"){
          let url=req.file.path;
          let filename=req.file.filename;
          listing.image={url,filename};
          await listing.save();
        }

        req.flash("success"," Listing Updated!");
        res.redirect(`/listings/${id}`);
};

module.exports.deleteListing=async (req,res)=>{
    try{
        let {id}=req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success","Listing Deleted");
    res.redirect("/listings");
    }
    catch(err){
        console.log(err);
    }
};
