const values = [
    `Exploring the Benefits of a Headless CMS`,
    `The Advantages of Headless CMS: A Comprehensive Guide`,
    `Everything You Need to Know About Headless CMS`,
    `How to Get Started with a Headless CMS`,
    `Headless CMS: A Step-by-Step Guide`,
    `10 Reasons to Choose a Headless CMS`,
    `Top 7 Features of a Headless CMS`,
    `10 Ideas for Utilizing a Headless CMS`,
    `10 Ways to Utilize a Headless CMS`,
    `10 Tips for Choosing the Right Headless CMS`,
    `Revolutionizing Business with Headless CMS`,
    `Headless CMS: The Future of Cloud Computing`,
    `Maximizing Efficiency with a Headless CMS`,
    `Headless CMS: The Future of Business Automation`,
    `The Impact of Headless CMS on Businesses`,
    `How Does a Headless CMS Work?`,
    `Is a Headless CMS Right for You?`,
    `When Is the Best Time to Use a Headless CMS?`,
    `Where Can You Find a Headless CMS?`,
    `Who Can Benefit from a Headless CMS?`
];

export const createTextValue = (id: string) => {
    const value = [...values].sort(() => Math.random() - 0.5).shift() as string;
    return `${value} - ${id}`;
};
