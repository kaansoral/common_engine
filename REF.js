// Datastore / Taskqueue references

// TRANSACTION
var transaction = datastore.transaction(),ex_reason=null;
try{
	await transaction.run();
	var tc_id="TC_"+random_string(29);
	var ticket={
		wallet:args.wallet,
		lottery:get_id(lottery),
		entry:args.entry,
		created:new Date(),
		processed:false,
		a_rand:a_rand("ticket"),
	};
	await transaction.save([
		{key:datastore.key(["Ticket",tc_id]),method:"insert",data:ticket}
		// insert - shouldn't exist
		// upsert - can exist
	]);
	await transaction.commit();
}catch(e){
	if(!ex_reason) console.error(e);
	await transaction.rollback();
	if(ex_reason) return {failed:true,reason:ex_reason};
	return {failed:true,reason:"try_again"};
}

// REGULAR SAVE
var key="LT_test"
var lottery={
	coins:10000000,
	created:new Date(),
	activity:new Date(),
	state:"entry", // "count" / "reward"
	incomplete:false,
	tickets:0,
	wnners:0,
	lucky:random_string(32,1),
	date:future_h(240),
	a_rand:a_rand("lottery"),
};
await datastore.save({key:datastore.key(['Lottery',key]),data:lottery});

// QUERY
var query=datastore.createQuery('Lottery').filter("date",">",new Date()).order("date");
if(args.cursor) query=query.start(args.cursor);
query=query.limit(80);
var results=await datastore.runQuery(query),cursor=null,lotteries=[];
if(results[1].moreResults!==Datastore.NO_MORE_RESULTS)
	cursor=results[1].endCursor;
results[0].forEach(function(l){
	lotteries.push({
		lottery:get_id(l),
		date:l.date,
		coins:l.coins,
	});
});
return {lotteries:lotteries,cursor:cursor};

async function renew_loop()
{
	var new_tables={};
	try{
		var more=true,cursor=null;
		while(more)
		{
			more=false;
			var query=query("table").select('__key__').limit(1000);
			if(cursor) query=query.start(cursor);
			var results=await datastore.runQuery(query);
			if(results[1].moreResults!==Datastore.NO_MORE_RESULTS)
				cursor=results[1].endCursor,more=true;
			results[0].forEach(function(l){
				new_tables[get_key(l).name]=true;
			});
		}
		for(var id in tables)
			if(!new_tables[id])
				delete tables[id];
	}
	catch(e){
		console.error(e);
	}
	setTimeout(renew_loop,72000);
}