export type ActionContext = {
    repository: {
        html_url: string
    }
    author: { 
        name: string
        email: string
    }
    deployer: string
    comment: string
}

export type GoogleCredentials = {
    client_email: string
    
}