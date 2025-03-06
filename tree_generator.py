import graphviz

dot = graphviz.Digraph(comment='Distribution Data Tree', format='png')

# Nodes
dot.node('A', 'WeeklyDistribution Document\n(_id, creatorName, tokenContract,\ndistributionContract, agentAddress, scheme,\nweekDistribution[])')
dot.node('B', 'Creator Data\n(creatorName, tokenContract,\ndistributionContract, agentAddress, scheme)')
dot.node('C', 'weekDistribution[]\n(array of WeekEntry)')
dot.node('D', 'WeekEntry\n(weekStart, DistributionData, dailyData, dataHash, signedHash)')
dot.node('E', 'DistributionData\n(recipients[], amounts[], totalAmount)')
dot.node('F', 'dailyData[]\n(array of DailyEntry)')
dot.node('G', 'DailyEntry\n(day, latestAttention, unixTimestamp,\nreqHash, resHash, distribution[])')
dot.node('H', 'distribution[]\n(array of distributionItem)')
dot.node('I', 'distributionItem\n(name, walletAddress, percentage)')

# Edges
dot.edge('A', 'C', label="contains")
dot.edge('C', 'D', label="each element")
dot.edge('D', 'E', label="contains")
dot.edge('D', 'F', label="contains")
dot.edge('F', 'G', label="each element")
dot.edge('G', 'H', label="contains")
dot.edge('H', 'I', label="each element")

# Render to file "distribution_tree.png"
dot.render('distribution_tree', cleanup=True)
