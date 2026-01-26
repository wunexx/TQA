interface UpgradeButtonProps{
    title?: string;
    desc?: string;
    cost: number;
}

export function UpgradeButton({title = "Upgrade", desc = "description", cost}: UpgradeButtonProps){
    return(
        <div className="upgrade-btn">
            <div className="upgrade-btn-text-cont">
                <h2>{title}</h2>
                <p>{desc}</p>
            </div>
            <div className="upgrade-btn-cost-cont">
                <h3 className="upgrade-btn-cost">Cost: {cost}</h3>
            </div>
        </div>
    )
}